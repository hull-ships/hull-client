# Browser access to User data

This connector makes data from Hull accessible in the browser,
so you can use it to personalize the page in realtime.

To use it:

1. Whitelist the web pages from which this connector should be allowed to launch.
1. In the Settings tab, choose which users will be forwarded by selecting one or more segments
2. Choose which attributes and segment names will be accessible client-side.
3. Paste the snippet in the page
4. In the Settings tab, write some javascript that will be run whenever the user is updated.

The Script will have access to an object `user` and an object `segments` with the following shapes:

```javascript
  const user = {
    ...whitelisted properties
  }
  const segments = [];
  
  console.log(user, segments);
```


We encourage you to write the script so that it can run multiple times without side effects (Be Idempotent). Users will come in multiple times.

Let's say you want to tag the User with a custom Facebook Event for each segment they belong to and the name of their company.
You'd then write:

```js
segments.map(function(segment){
  fbq('trackCustom', 'In Segment '+segment, {
    metrics_raised: user.clearbit_company.metrics_raised
  });
})
```


# Identity Resolution

When installed from `Hull.js`, the connector fetches the user ID from Hull.

When installed as a code snippet, the connector will look for identifiers, in the following order:

- A variable called `hull_id` in Local Storage
- `ajs_email`, `ajs_uid`, `ajs_aid` fields in the Querystring (Segments's Querystring API)
- Intercom's `visitor ID`
- Hull's `anonymousId`, `externalId`, `hullId`, `email`
- Segment's `userId`, `anonymousId`, `email`
