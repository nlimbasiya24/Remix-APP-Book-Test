// remix-test-app/app/routes/login.tsx
import { useState } from "react";
import { Form, useActionData, redirect } from "@remix-run/react";
import { ActionFunction, json } from "@remix-run/node";
import { Card, Page, TextField, Button, BlockStack,ButtonGroup } from "@shopify/polaris";
import { commitSession, getSession } from "../session.server";

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

  return redirect("/authors/list", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function Login() {
  const actionData: any = useActionData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    setLoading(true);
  };

  return (
    <Page title="Login">
      <Card>
        <Form method="post" onSubmit={handleSubmit}>
          <BlockStack gap="200">
            {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
            <TextField  label="Email" name="email" value={email} onChange={setEmail} autoComplete="email" />
            <TextField label="Password" name="password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
            <ButtonGroup>
                  <Button  submit  loading={loading} variant="primary">
                    Login
                  </Button>
            </ButtonGroup>
          </BlockStack>

        </Form>
      </Card>
    </Page>
  );
}
