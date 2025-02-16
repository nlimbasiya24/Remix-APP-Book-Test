import { useParams, useNavigate } from "@remix-run/react";
import { Page, Card, DataTable, Button, Spinner, BlockStack, InlineGrid, Text } from "@shopify/polaris";
import { useEffect, useState } from "react";

export default function AuthorDetails() {
  const { authorId } = useParams();
  const navigate = useNavigate();
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    const storedAuthors = localStorage.getItem("authorsData");
    if (storedAuthors) {
      const authors = JSON.parse(storedAuthors);
      const foundAuthor = authors.find((a) => a.id === Number(authorId));
      if (foundAuthor) {
        setAuthor(foundAuthor);
      }
    }
  }, [authorId]);

  if (!author) {
    return <Spinner accessibilityLabel="Loading Author Details" size="large" />;
  }

  const bookRows = author?.books?.map((book) => [
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
              {author?.first_name} {author?.last_name}
            </Text>
            <Button
              onClick={() => navigate(`/books/add`)}
              accessibilityLabel="Add New Book"
              variant="primary"
            >
              Add New Book
            </Button>
          </InlineGrid>
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
