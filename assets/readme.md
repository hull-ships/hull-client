# Client-side access to User data

This connector makes data from Hull accessible in the browser,
so you can use it to personalize the page in realtime.

To use it:

1. In the Settings tab, chose which users will ben enriched by selecting one or more segments
2. Choose which attributes and segment names will be visible client-side.
3. Paste the snippet in the page
4. Write some Javascript to react to new and changed data in the user profile like so:

```js
_hull.emitter.on("user.update", function(user) {
  console.log("User Updated", user);
})
```
