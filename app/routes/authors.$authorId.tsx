import { LoaderFunction, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getSession } from "../session.server";
import { Page, Card, DataTable, Button, Form } from "@shopify/polaris";

interface Book {
  id: number;
  title: string;
  release_date: string;
  isbn: string;
  format: string;
  number_of_pages: number;
}

interface AuthorDetails {
  id: number;
  first_name: string;
  last_name: string;
  books: Book[];
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) {
    return redirect("/login");
  }

  const { authorId } = params;

  const authorResponse = await fetch(`https://candidate-testing.com/api/v2/authors/${authorId}`, {
    headers: {
      "Accept": "application/json",
      "Authorization": token,
    },
  });
  const booksResponse = await fetch(`https://candidate-testing.com/api/v2/books?orderBy=id&direction=ASC&limit=12&page=1`, {
    headers: {
      "Accept": "application/json",
      "Authorization": token,
    },
  });

  const authorData = await authorResponse.json();
  const booksData = await booksResponse.json();

  return json<AuthorDetails>({ ...authorData, books: booksData.items || [] });
};

export default function AuthorDetails() {
  const author = useLoaderData<AuthorDetails>();

  const bookRows = author.books.map(book => [
    book.title,
    book.release_date.split("T")[0],
    book.isbn,
    book.format,
    book.number_of_pages.toString(),
    // <Form method="post" action={`/books/${book.id}/delete`}>
      <Button>
        Delete
      </Button>
    // </Form>
  ]);

  return (
    <Page title={`${author.first_name} ${author.last_name}`}>
      <Card>
        <h1>{author.first_name} {author.last_name}</h1>
      </Card>
      <Card>
        <DataTable 
          columnContentTypes={["text", "text", "text", "text", "numeric", "text"]} 
          headings={["Title", "Release Date", "ISBN", "Format", "Pages", "Actions"]} 
          rows={bookRows} 
        />
      </Card>
    </Page>


  );
}