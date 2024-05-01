// ==UserScript==
// @name         example-sse
// @namespace    example
// @version      1.0.0
// @description  example sse
// @author       You
// @match        *://**/*
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
  const TYPE = '<TYPE>' // replace with your type
  const { waitForPageReady, setStatusText, useSessionStorage } = utils;

  // only need to implement prepareForTask and processTaskHandler
  function prepareForTask(task) {
    console.log('processTaskHandler', task)
    // open the url or do something else to prepare for the task
  }
  async function processTaskHandler(task) {
    // this will run once page is refreshed
    await waitForPageReady()
    // process the task
    console.log('processTaskHandler', task)
    // task.payload is the data sent from the server
    // get payload from task.payload

    // perform action
    const body = {}

    // inform server that the task is done
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: `${SERVER_URL}/${task.url}`, // server will provide callback url
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
