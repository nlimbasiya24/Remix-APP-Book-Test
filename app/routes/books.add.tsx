import { LoaderFunction, ActionFunction, json, redirect } from "@remix-run/node";
import { useFetcher, useNavigate } from "@remix-run/react";
import { getSession } from "../session.server";
import { Page, Card, TextField, Button, Select, FormLayout, InlineStack } from "@shopify/polaris";
import { logger } from "../logger"
import { useEffect, useState } from "react";

// Define Book & Author Interfaces
interface Book {
  id?: number;
  title: string;
  release_date: string;
  description: string;
  isbn: string;
  format: string;
  number_of_pages: number;
  authorId?: number | null;
}

interface Author {
  id: number;
  first_name: string;
  last_name: string;
}

// Loader Function (Check if user is authenticated)
export const loader: LoaderFunction = async ({ request }) => {
  logger.info("Inside Loading function of books add");
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) {
    return redirect("/login");
  }

  return null;
};

// Action Function (Handle Form Submission)
export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const newBook = {
    author: { id: Number(formData.get("authorId")) },
    title: formData.get("title")?.toString().trim(),
    release_date: formData.get("release_date")?.toString().trim(),
    description: formData.get("description")?.toString().trim(),
    isbn: formData.get("isbn")?.toString().trim(),
    format: formData.get("format")?.toString().trim(),
    number_of_pages: Number(formData.get("number_of_pages")),
  };

  // Validate required fields
  if (!newBook.title || !newBook.release_date || !newBook.author.id) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

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

  return redirect("/authors/list");
};

export default function AddBook() {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const loadingpost =  ["loading", "submitting"].includes(fetcher.state) &&
  fetcher.formMethod === "POST";
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>(undefined);
  const [bookDetails, setBookDetails] = useState<Book>({
    title: "",
    release_date: "",
    description: "",
    isbn: "",
    format: "",
    number_of_pages: 0,
  });

  useEffect(() => {
    const storedAuthors = localStorage.getItem("authorsData");
    if (storedAuthors) {
      const parsedAuthors: Author[] = JSON.parse(storedAuthors);
      setAuthors(parsedAuthors);
      if (parsedAuthors.length > 0) {
        setSelectedAuthor(String(parsedAuthors[0].id)); // Default to first author
      }
    } else {
      navigate("/authors/list"); // Redirect if no authors found
    }
  }, [navigate]);

  // Handle Input Changes
  const handleChange = (field: keyof Book, value: string) => {
    setBookDetails((prev) => ({
      ...prev,
      [field]: field === "number_of_pages" ? Number(value) : value,
    }));
  };

  return (
    <Page title="Add New Book">
      <Card>
        <fetcher.Form method="post">
          <FormLayout>
            {/* Author Selection */}
            <Select
              label="Author"
              options={authors.map((a) => ({ label: `${a.first_name} ${a.last_name}`, value: String(a.id) }))}
              value={selectedAuthor}
              onChange={(value) => setSelectedAuthor(value)}
              name="authorId"
            />

            {/* Book Details */}
            <TextField label="Title" value={bookDetails.title} onChange={(value) => handleChange("title", value)} name="title" autoComplete="off" />
            <TextField label="Release Date" type="date" value={bookDetails.release_date} onChange={(value) => handleChange("release_date", value)} name="release_date" autoComplete="off" />
            <TextField label="Description" value={bookDetails.description} onChange={(value) => handleChange("description", value)} name="description" autoComplete="off" />
            <TextField label="ISBN" value={bookDetails.isbn} onChange={(value) => handleChange("isbn", value)} name="isbn" autoComplete="off" />
            <TextField label="Format" value={bookDetails.format} onChange={(value) => handleChange("format", value)} name="format" autoComplete="off" />
            <TextField label="Number of Pages" type="number" value={String(bookDetails.number_of_pages)} onChange={(value) => handleChange("number_of_pages", value)} name="number_of_pages" autoComplete="off" />

            {/* Submit Button */}
            <InlineStack gap="200">
              <Button submit variant="primary" tone="success" loading={loadingpost}>
                Add Book
              </Button>
              <Button onClick={() => navigate("/authors/list")} variant="secondary">
                Cancel
              </Button>
            </InlineStack>
          </FormLayout>
        </fetcher.Form>
      </Card>
    </Page>
  );
}
