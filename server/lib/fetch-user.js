import _ from "lodash";

export default async function fetchUser(client) {
  try {
    console.log("Calling FetchUser")
    const user = await client.get("/me/user_report");
    if (!user || !user.id) {
      client.logger.info("outgoing.user.error", { message: "Not found" });
      throw new Error("No user found", user);
    }
    client.logger.info("outgoing.user.success");
    const { account, segments } = user;
    return {
      user: _.omit(user, "account", "segments"),
      segments,
      account
    };
  } catch (err) {
    client.logger.info("outgoing.user.error", { error: err });
    throw err;
  }
}
