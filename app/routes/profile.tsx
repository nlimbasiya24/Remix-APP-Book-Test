import { LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { getSession, destroySession } from "../session.server";
import { useEffect, useState } from "react";
import { Page, Card, Button, DataTable } from "@shopify/polaris";


export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return redirect("/login");
  }
  return { user };
};

export default function Profile() {
  const { user }:any = useLoaderData();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const storedActivities = JSON.parse(localStorage.getItem("activities")) || [];
    setActivities(storedActivities);
  }, []);

  const rows = activities.map((activity, index) => [
    index + 1,
    activity,
  ]);

  return (
    <Page title="Profile">
      <Card>
        <h1 className="text-2xl font-bold">{user.first_name} {user.last_name}</h1>
        <Form method="post" action="/logout">
          <Button submit variant="primary" tone="critical">Logout</Button>
        </Form>
      </Card>
      <Card >
        {activities.length > 0 ? (
          <DataTable
            columnContentTypes={["numeric", "text"]}
            headings={["#", "Activity"]}
            rows={rows}
          />
        ) : (
          <p>No recent activities.</p>
        )}
      </Card>
    </Page>
  );
}