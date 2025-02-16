// remix-test-app/app/routes/books/add.tsx
import { LoaderFunction, ActionFunction, json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { getSession } from "../session.server";
import { Page, Card, TextField, Button, Select } from "@shopify/polaris";
import { useState } from "react";

interface Author {
  id: number;
  first_name: string;
  last_name: string;
}

interface LoaderData {
  authors: Author[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) {
    return redirect("/login");
  }

  const response = await fetch("https://candidate-testing.com/api/v2/authors?orderBy=id&direction=ASC&limit=50", {
    headers: {
      "Accept": "application/json",
      "Authorization": token,
    },
  });
  const data = await response.json();

  return json<LoaderData>({ authors: data.items || [] });
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const newBook = {
    author: { id: Number(formData.get("authorId")) },
    title: formData.get("title"),
    release_date: formData.get("release_date"),
    description: formData.get("description"),
    isbn: formData.get("isbn"),
    format: formData.get("format"),
    number_of_pages: Number(formData.get("number_of_pages")),
  };

  const response = await fetch("https://candidate-testing.com/api/v2/books", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Authorization": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newBook),
  });

  if (!response.ok) {
    return json({ error: "Failed to add book" }, { status: 400 });
  }

  return redirect("/authors");
};

export default function AddBook() {
  const { authors } = useLoaderData<LoaderData>();
  const [authorId, setAuthorId] = useState("");
  const authorOptions = authors.map(a => ({ label: `${a.first_name} ${a.last_name}`, value: String(a.id) }));

  return (
    <Page title="Add New Book">
      <Card>
        <Form method="post">
          <Select
            label="Author"
            options={authorOptions}
            value={authorId}
            onChange={setAuthorId}
            name="authorId"
          />
          <TextField
      label="Title"
      autoComplete="off"
    />
          <TextField label="Release Date"  autoComplete="off" />
          <TextField label="Description"  autoComplete="off" />
          <TextField label="ISBN" autoComplete="off" />
          <TextField label="Format" name="format" autoComplete="off" />
          <TextField label="Number of Pages" autoComplete="off" />
          <Button submit variant="primary" tone="success">Add Book</Button>
        </Form>
      </Card>
    </Page>
  );
}
