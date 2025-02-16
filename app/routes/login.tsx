import { useState } from "react";
import { Form, useActionData, redirect } from "@remix-run/react";
import { ActionFunction, json } from "@remix-run/node";
import { Card, Page, TextField, Button,BlockStack,AppProvider } from "@shopify/polaris";
import { commitSession, getSession, destroySession } from "../session.server";


export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  const response = await fetch("https://candidate-testing.com/api/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();

  if (!response.ok) {
    return json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getSession(request.headers.get("Cookie"));
  session.set("token", data.token_key);
  session.set("user", data.user);

  return redirect("/authors", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function Login() {
  const actionData:any = useActionData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
   
    <Page title="Login">
      <Card >
        <Form method="post">
          <BlockStack>
            {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
            <TextField label="Email" name="email" value={email} onChange={setEmail} autoComplete="email"/>
            <TextField label="Password" name="password" type="password" value={password} onChange={setPassword} autoComplete="current-password"/>
            <Button submit variant="primary">Login</Button>
          </BlockStack>
        </Form>
      </Card>
    </Page>
  

  );
}