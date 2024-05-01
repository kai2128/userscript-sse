# Userscript SSE

Allow userscripts to be called via api using server sent events.

## Development

- install [deno](https://deno.land/)
- `npx degit kai2128/userscript-sse my-userscript-sse`
- copy `.env.example` to `.env`

```bash
deno task dev
```

- copy `userscripts/` js files to tampermonkey
- refering to the example files and using the template files in `routes` and `userscripts` folder to create new api

## Example

```bash
curl --request POST \
  --url http://localhost:8902/example/get-search \
  --data '{
 "query": "test",
 "shouldRefresh": 1
}'
```

Response:

```json
{
 "query": "test",
 "data": [
  {
   "title": "Test Definition & Meaning - Merriam-Webster",
   "url": "https://www.merriam-webster.com/dictionary/test",
   "description": ""
  },
  {},
  {
   "title": "TEST | English meaning - Cambridge Dictionary",
   "url": "https://dictionary.cambridge.org/dictionary/english/test",
   "description": "Idiom ... to use a set of questions or practical activities to measure someone's knowledge and ability: Multiple-choice questions tested the students' knowledge."
  },
  ...
 ]
}
```

## Inspirations

- [CatWebRPC](https://github.com/x0tools/CatWebRPC)
- [sekiro-open](https://github.com/yint-tech/sekiro-open)

- [Server-Sent Events 教程](https://www.ruanyifeng.com/blog/2017/05/server-sent_events.html)
- [油猴开发指南](https://learn.scriptcat.org/)