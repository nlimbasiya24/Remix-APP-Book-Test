import { LoaderFunction, ActionFunction, json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useFetcher } from "@remix-run/react";
import { getSession, commitSession } from "../session.server";
import { Page, Card, TextField, Button, Select } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { logger } from "../logger";

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
  logger.info("Loading Profile: Checking if user is authenticated");
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    logger.warn("User not authenticated. Redirecting to login.");
    return redirect("/login");
  }

  logger.info("User authenticated, loading profile data.");
  return json<LoaderData>({ user });
};

export const action: ActionFunction = async ({ request }) => {
  logger.info("Processing profile update action.");
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    logger.warn("Unauthorized attempt to update profile. Redirecting.");
    return redirect("/login");
  }

  const formData = await request.formData();
  const updatedUser = {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    gender: formData.get("gender"),
    active: true,
    email_confirmed: true,
    google_id: user.email,
  };

  logger.info(`Sending update request for user ID: ${user.id}`);

  // API call to update user profile
  const response = await fetch(`https://candidate-testing.com/api/v2/users/${user.id}`, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Authorization": session.get("token"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedUser),
  });

  if (!response.ok) {
    logger.error("Failed to update profile.");
    return json({ error: "Failed to update profile" }, { status: 400 });
  }

  const updatedUserData = await response.json();
  logger.info("Profile updated successfully.");

  // Update session with new user data
  session.set("user", updatedUserData);

  return redirect("/profile", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function ProfilePage() {
  const { user } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [gender, setGender] = useState(user.gender);
  const [loading, setLoading] = useState(false);

  // Handling form submission
  useEffect(() => {
    if (fetcher.state === "submitting") {
      setLoading(true);
    } else if (fetcher.state === "idle") {
      setLoading(false);
      if (fetcher.data) {
        logger.error("Profile update failed.");
      } else {
        logger.info("Profile updated successfully.");
        // Update local storage
        localStorage.setItem(
          "userProfile",
          JSON.stringify({ first_name: firstName, last_name: lastName, gender })
        );
      }
    }
  }, [fetcher.state]);

  return (
    <Page title="Profile">
      <Card>
        <Form method="post">
          <TextField label="First Name" name="first_name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
          <TextField label="Last Name" name="last_name" value={lastName} onChange={setLastName} autoComplete="family-name" />
          <Select label="Gender" name="gender" options={["male", "female", "other"]} value={gender} onChange={setGender} />
          <p><strong>Active:</strong> {user.active ? "Yes" : "No"}</p>
          <p><strong>Email Confirmed:</strong> {user.email_confirmed ? "Yes" : "No"}</p>
          <Button loading={loading} submit variant="primary">Update Profile</Button>
        </Form>
      </Card>
    </Page>
  );
}
