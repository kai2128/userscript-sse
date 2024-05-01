// ==UserScript==
// @name         example-sse
// @namespace    example
// @version      1.0.0
// @description  example sse
// @author       You
// @match        *://www.google.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        window.close
// @connect      localhost
// @require      https://cdn.jsdelivr.net/npm/@kai2128/utils@0.0.2/dist/index.js
// ==/UserScript==

(async function () {
  'use strict';
  const SERVER_URL = 'http://localhost:8902';
  const TYPE = 'example'
  const { waitForPageReady, waitForElms, setStatusText, useSessionStorage } = utils;

  function prepareForTask(task) {
    // open the url or do something else to prepare for the task
    console.log('processTaskHandler', task)
    const query = encodeURIComponent(task.payload.query)
    document.location.href = 'https://www.google.com/search?q=' + query
  }
  async function processTaskHandler(task) {
    await waitForPageReady()
    // process the task
    console.log('processTaskHandler', task)
    const { query } = task.payload

    const searchResultsElems = await waitForElms('.dURPMd > div')
    const data = searchResultsElems.map((elem) => {
      const titleElem = elem.querySelector('h3')
      const title = titleElem?.textContent
      const urlElem = elem.querySelector('a')
      const url = urlElem?.href
      const descriptionElem = elem.querySelector('[style="-webkit-line-clamp:2"]')
      const description = descriptionElem?.textContent
      return { title, url, description }
    })

    const body = {
      query,
      data
    }
    console.log('data', body)

    // inform server that the task is done
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: `${SERVER_URL}/${task.url}`,
        headers: {
          'client-id': useSessionStorage().get('client-id'),
        },
        data: JSON.stringify(body),
        onload: function (_) {
          console.log('success task')
          setStatusText('success task')
          resolve();
        },
        onerror: function (response) {
          console.log('error', response)
          setStatusText('error', response)
          reject()
        }
      })
    })
  }

  // code to init the client
  const { start } = useTaskHandler({
    prepareForTask,
    processTaskHandler
  })
  start();
  function useTaskHandler({ prepareForTask = () => { }, processTaskHandler = () => { } }) {
    let clientId = useSessionStorage().get('client-id');
    let task = useSessionStorage().get('task');

    async function listenMessage() {
      if (task != null) {
        return;
      }

      const params = new URLSearchParams({
        type: TYPE,
        id: clientId,
        username: ''
      });
      const eventSource = new EventSource(`${SERVER_URL}/client/listen?${params.toString()}`);

      const taskHandler = (event) => {
        eventSource.close();
        handleTask(event)
      }
      if (clientId) {
        eventSource.addEventListener(`client-${clientId}`, taskHandler);
      }
      eventSource.addEventListener('register', (event) => {
        const client = JSON.parse(event.data);
        clientId = client.id;
        console.log('registered', clientId)
        useSessionStorage().set('client-id', clientId);
        eventSource.addEventListener(`client-${clientId}`, taskHandler);
        console.log(`client ${clientId} listening for task...`)
        setStatusText(`client ${clientId} listening for task...`)
      })
      eventSource.addEventListener('heartbeat', (event) => {
        // const data = JSON.parse(event.data);
        // console.log('Received message from server:', data);
      });
      if (clientId) {
        console.log(`client ${clientId} listening for task...`)
        setStatusText(`client ${clientId} listening for task...`)
      }
    }


    function handleTask(event) {
      // console.log('handleTask', event.data)
      setStatusText('handle task', event.data)
      const task = JSON.parse(event.data);
      useSessionStorage().set('task', task);
      prepareForTask(task)
    }

    async function processTask() {
      if (task == null) {
        return;
      }
      console.log(task.payload)
      setStatusText('processing task', task.payload)
      try {
        await processTaskHandler(task);
      } catch (e) {
        setStatusText('error process task', e)
        throw e
      } finally {
        task = null;
        useSessionStorage().remove('task');
      }
    }

    return {
      start: async () => {
        try {
          const taskExist = useSessionStorage().get('task') !== null;
          if (taskExist) {
            await processTask();
            await listenMessage();
          } else {
            await listenMessage();
          }
        } catch (e) {
          console.error('error process task', e)
          setStatusText('error process task', e)
          task = null
          setTimeout(listenMessage, 5000)
        }
      },
      registerHandler: (preProcessHandler, taskHandler) => {
        processTaskHandler = taskHandler;
        prepareForTask = preProcessHandler;
      }
    }
  }
})();
