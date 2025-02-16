// remix-test-app/app/routes/authors.tsx
import { LoaderFunction, ActionFunction, json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useSearchParams, Link } from "@remix-run/react";
import { getSession } from "../session.server";
import { Page, Card, DataTable, Button, Pagination } from "@shopify/polaris";

interface Author {
  id: number;
  first_name: string;
  last_name: string;
  place_of_birth: string;
  birthday: string;
}

interface LoaderData {
  items: Author[];
  total_pages: number;
  current_page: number;
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) {
    return redirect("/login");
  }

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";

  const response = await fetch(`https://candidate-testing.com/api/v2/authors?orderBy=id&direction=ASC&limit=12&page=${page}`, {
    headers: {
      "Accept": "application/json",
      "Authorization": token,
    },
  });
  const data = await response.json();

  return json<LoaderData>({ items: data.items || [], total_pages: data.total_pages || 1, current_page: data.current_page || 1 });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const authorId = formData.get("authorId") as string;

  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) {
    return redirect("/login");
  }

  const deleteResponse = await fetch(`https://candidate-testing.com/api/v2/authors/${authorId}`, {
    method: "DELETE",
    headers: {
      "Authorization": token,
      "Accept": "application/json",
    },
  });

  if (!deleteResponse.ok) {
    return json({ error: "Unable to delete author" }, { status: 400 });
  }

  return redirect("/authors");
};

export default function Authors() {
  const { items: authors, total_pages, current_page } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();

  const rows = authors.map((author) => [
    <Link to={`/authors/${author.id}`}>{`${author.first_name} ${author.last_name}`}</Link>,
    author.place_of_birth,
    author.birthday.split("T")[0],
    <Form method="post">
      <input type="hidden" name="authorId" value={String(author.id)} />
      <Button variant="primary" tone="critical">
        Delete
      </Button>
    </Form>
  ]);

  const handleNextPage = () => {
    if (current_page < total_pages) {
      setSearchParams({ page: String(current_page + 1) });
    }
  };

  const handlePreviousPage = () => {
    if (current_page > 1) {
      setSearchParams({ page: String(current_page - 1) });
    }
  };

  return (
    <Page title="Authors">
      <Card>
        <DataTable 
          columnContentTypes={["text", "text", "text", "text"]} 
          headings={["Name", "Place of Birth", "Birthday", "Actions"]} 
          rows={rows} 
        />
      </Card>
      <Pagination
        hasPrevious={current_page > 1}
        onPrevious={handlePreviousPage}
        hasNext={current_page < total_pages}
        onNext={handleNextPage}
      />
    </Page>
  );
}