// remix-test-app/app/routes/authors.tsx
import { LoaderFunction, defer, redirect } from "@remix-run/node";
import { useLoaderData, Form, useSearchParams, Link, Await } from "@remix-run/react";
import { Suspense } from "react";
import { getSession } from "../session.server";
import { Page, Card, DataTable, Button, Pagination, Spinner } from "@shopify/polaris";

interface Author {
  id: number;
  first_name: string;
  last_name: string;
  birthday: string;
  biography: string;
  gender: string;
  place_of_birth: string;
  book_count: number;
}

interface AuthorsData {
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

  const authorsDataPromise = fetch(`https://candidate-testing.com/api/v2/authors?orderBy=id&direction=ASC&limit=12&page=${page}`, {
    headers: {
      "Accept": "application/json",
      "Authorization": token,
    },
  }).then((res) => res.json());

  const authorsWithBooksPromise = authorsDataPromise.then(async (authorsData: AuthorsData) => {
    return Promise.all(
      authorsData.items.map(async (author: Author) => {
        const authorResponse = await fetch(`https://candidate-testing.com/api/v2/authors/${author.id}`, {
          headers: {
            "Accept": "application/json",
            "Authorization": token,
          },
        });
        const authorDetail = await authorResponse.json();
        return { ...author, book_count: authorDetail.books.length };
      })
    );
  });

  return defer({
    authorsDataPromise: authorsDataPromise,
    authorsWithBooksPromise: authorsWithBooksPromise,
  });
};

export default function AuthorsList() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Page title="Authors">
      <Suspense fallback={<Spinner accessibilityLabel="Loading Authors" size="large" />}>
        <Await resolve={loaderData.authorsWithBooksPromise}>
          {(authors: Author[]) => {
            const rows = authors.map((author) => [
              <Link to={`/authors/${author.id}`}>{`${author.first_name} ${author.last_name}`}</Link>,
              author.book_count,
              <Form method="post">
                <input type="hidden" name="authorId" value={String(author.id)} />
                <Button submit variant="primary" tone="critical" disabled={author.book_count > 0}>
                  Delete
                </Button>
              </Form>
            ]);
            return (
              <>
                <Card>
                  <DataTable 
                    columnContentTypes={["text", "numeric", "text"]} 
                    headings={["Name", "Book Count", "Actions"]} 
                    rows={rows} 
                  />
                </Card>
                <Pagination
                  hasPrevious={loaderData.authorsDataPromise.current_page > 1}
                  onPrevious={() => setSearchParams({ page: String(loaderData.authorsDataPromise.current_page - 1) })}
                  hasNext={loaderData.authorsDataPromise.current_page < loaderData.authorsDataPromise.total_pages}
                  onNext={() => setSearchParams({ page: String(loaderData.authorsDataPromise.current_page + 1) })}
                />
              </>
            );
          }}
        </Await>
      </Suspense>
    </Page>
  );
}
