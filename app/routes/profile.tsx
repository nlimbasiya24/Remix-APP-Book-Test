// remix-test-app/app/routes/profile.tsx
import { LoaderFunction, ActionFunction, json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { getSession, commitSession } from "../session.server";
import { Page, Card, TextField, Button, Select } from "@shopify/polaris";
import { useState } from "react";

type LoaderData = {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    gender: string;
    active: boolean;
    email_confirmed: boolean;
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return redirect("/login");
  }

  return json<LoaderData>({ user });
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const updatedUser = {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    gender: formData.get("gender"),
  };

  // Send update request to API
  const response = await fetch(`https://candidate-testing.com/api/v2/users/${user.id}`, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Authorization": session.get("token"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...user, ...updatedUser }),
  });

  if (!response.ok) {
    return json({ error: "Failed to update profile" }, { status: 400 });
  }

  const updatedUserData = await response.json();
  session.set("user", updatedUserData);

  return redirect("/profile", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function ProfilePage() {
  const { user } = useLoaderData<LoaderData>();
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [gender, setGender] = useState(user.gender);

  return (
    <Page title="Profile">
      <Card >
        <Form method="post">
          <TextField label="First Name" name="first_name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
          <TextField label="Last Name" name="last_name" value={lastName} onChange={setLastName} autoComplete="family-name" />
          <Select label="Gender" name="gender" options={["male", "female", "other"]} value={gender} onChange={setGender} />
          <p><strong>Active:</strong> {user.active ? "Yes" : "No"}</p>
          <p><strong>Email Confirmed:</strong> {user.email_confirmed ? "Yes" : "No"}</p>
          <Button submit variant="primary">Update Profile</Button>
        </Form>
      </Card>
    </Page>
  );
}
