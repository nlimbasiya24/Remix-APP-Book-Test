import { useParams, useNavigate } from "@remix-run/react";
import { Page, Card, DataTable, Button, Spinner, BlockStack, InlineGrid, Text, TextField } from "@shopify/polaris";
import { useEffect, useState } from "react";

interface Book {
  id: number;
  title: string;
  release_date: string;
  description: string;
  isbn: string;
  format: string;
  number_of_pages: number;
}

interface Author {
  id: number;
  first_name: string;
  last_name: string;
  books: Book[];
}

export default function AuthorDetails() {
  const { authorId } = useParams();
  const navigate = useNavigate();
  const [author, setAuthor] = useState<Author | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

  useEffect(() => {
    const storedAuthors = localStorage.getItem("authorsData");
    if (storedAuthors) {
      const authors: Author[] = JSON.parse(storedAuthors);
      const foundAuthor = authors.find((a) => a.id === Number(authorId));
      if (foundAuthor) {
        setAuthor(foundAuthor);
        setFilteredBooks(foundAuthor.books);
      }
    }
  }, [authorId]);

  useEffect(() => {
    if (author) {
      const filtered = author.books.filter((book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.format.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.release_date.includes(searchQuery)
      );
      setFilteredBooks(filtered);
    }
  }, [searchQuery, author]);

  if (!author) {
    return <Spinner accessibilityLabel="Loading Author Details" size="large" />;
  }

  const bookRows = filteredBooks.map((book) => [
    book.title,
    book.description,
    book.release_date.split("T")[0],
    book.isbn,
    book.format,
    book.number_of_pages.toString(),
    <Button>Delete</Button>,
  ]);

  return (
    <Page title="Author Details">
      <Card>
        <BlockStack gap="200">
          <InlineGrid columns="1fr auto">
            <Text as="h2" variant="headingSm">
              {author.first_name} {author.last_name}
            </Text>
            <Button
              onClick={() => navigate(`/books/add`)}
              accessibilityLabel="Add New Book"
              variant="primary"
            >
              Add New Book
            </Button>
          </InlineGrid>
          <TextField
            label="Search Books"
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            placeholder="Search by title, genre, or publication year"
            autoComplete="off"
          />
        </BlockStack>
      </Card>
      <Card>
        <DataTable
          columnContentTypes={["text", "text", "text", "text", "text", "numeric", "text"]}
          headings={["Title", "Description", "Release Date", "ISBN", "Format", "Pages", "Actions"]}
          rows={bookRows}
        />
      </Card>
    </Page>
  );
}
