import { useParams, useNavigate, useFetcher } from "@remix-run/react";
import { Page, Card, DataTable, Button, Spinner, BlockStack, InlineGrid, Text, TextField, Modal, FormLayout, ButtonGroup } from "@shopify/polaris";
import { useEffect, useState } from "react";
import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node";
import { getSession } from "../session.server";
import { logger } from "../logger";

interface Book {
  id: number;
  title: string;
  release_date: string;
  description: string;
  isbn: string;
  format: string;
  number_of_pages: number;
  autherId?:number | null;
}

interface Author {
  id: number;
  first_name?: string;
  last_name?: string;
  birthday?: string;
  biography?: string;
  gender?: string;
  place_of_birth?: string;
  book_count: number;
  books:[];
}

export const loader: LoaderFunction = async ({ request }) => {
  logger.info("Checking if user is authenticated in loader function");
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) {
    logger.warn("User is not authenticated, redirecting to login");
    return redirect("/login");
  }
  
  logger.info("User is authenticated, proceeding");
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  logger.info("Processing book update action");
  logger.info(`request method ${JSON.stringify(request?.method)}`)
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  console.log("request",request.method)
  if (!token) {
    logger.warn("Unauthorized attempt to update book");
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await request.formData();
  const updatedBook = Object.fromEntries(formData);
  const payload = {
    author: {
    id: Number(updatedBook.authorId)
      },
      title: updatedBook.title,
      release_date: updatedBook.release_date,
      description: updatedBook.description,
      isbn: updatedBook.isbn,
      format: updatedBook.format,
      number_of_pages:Number(updatedBook.number_of_pages)
  }

  logger.info(`Updating book with ID: ${JSON.stringify(updatedBook,null,2)}`);
  if(request.method ==="PUT"){
  logger.info(`book payload is: ${JSON.stringify(payload,null,2)}`);
  const response = await fetch(`${process.env.BASEURL}/books/${Number(updatedBook.id)}`, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": token,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    logger.error("Failed to update book");
    return json({ error: "Failed to update book" }, { status: 400 });
  }
  let data = await response.json();
  console.log("data",data);

  logger.info("Book updated successfully");
  return json({updatedBookResponse:data,method:"put"});
 }else if(request.method ==="DELETE" ) {
  console.log("BBBBBB");

  const response = await fetch(`${process.env.BASEURL}/books/${updatedBook.id}`, {
    method: "DELETE",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": token,
    },
  });
  if (!response.ok) {
    logger.error("Failed to delete book");
    return json({ error: "Failed to delete book" }, { status: 400 });
  }
  logger.info("Book deleted successfully");
  return json({ success: true ,method:"delete",bookId : updatedBook.id, authorId: updatedBook.authorId  });
 }
};

export default function AuthorDetails() {
  const { authorId } = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [author, setAuthor] = useState<Author | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadingDelete =  ["loading", "submitting"].includes(fetcher.state) &&
  fetcher.formMethod === "DELETE";
  const loadingEdit =  ["loading", "submitting"].includes(fetcher.state) &&
  fetcher.formMethod === "PUT";

  useEffect(() => {
    const storedAuthors = localStorage.getItem("authorsData");
    if (storedAuthors) {
      const authors: Author[] = JSON.parse(storedAuthors);
      const foundAuthor:any = authors.find((a) => a.id === Number(authorId));
      if (foundAuthor) {
        setAuthor(foundAuthor);
        setFilteredBooks(foundAuthor.books);
      }
    }else{
        navigate("/authors/list")
    }
  }, [authorId]);
  useEffect(() => {
    console.log("fetcher.data", fetcher.data);
  
    if (fetcher.data) {
      const storedAuthors = localStorage.getItem("authorsData");
  
      if (storedAuthors) {
        const { method, bookId, authorId, updatedBookResponse }: any = fetcher.data;
        const authors: Author[] = JSON.parse(storedAuthors);
  
        // Handle Delete Flow
        if (method === "delete") {
          const updatedAuthors: any = authors.map((author: Author) => {
            if (Number(author.id) === Number(updatedBookResponse?.auther?.id)) {
              return {
                ...author,
                books: author?.books?.filter(
                  (book: any) => Number(book.id) !== Number(updatedBookResponse)
                ),
                book_count: author?.book_count - 1, // Reduce book count
              };
            }
            return author;
          });
  
          localStorage.setItem("authorsData", JSON.stringify(updatedAuthors));
          setFilteredBooks((prevBooks) =>
            prevBooks.filter((book) => Number(book.id) !== Number(bookId))
          );
        }
  
        // Handle Update Flow
        else if (method === "put") {
          setIsEditing(false);
         

          console.log("updatedBookResponse",updatedBookResponse);

          const updatedAuthors: any = authors.map((author: Author) => {
            if (Number(author.id) === Number(updatedBookResponse.author.id)) {
              return {
                ...author,
                books: author?.books?.map((book: any) =>
                  Number(book.id) === Number(updatedBookResponse.id) ? { ...book, title:updatedBookResponse.title,
                    description:updatedBookResponse.description,format:updatedBookResponse.format } : book
                ),
              };
            }
            return author;
          });
  
          localStorage.setItem("authorsData", JSON.stringify(updatedAuthors));
  
          setFilteredBooks((prevBooks) =>
            prevBooks.map((book) =>
              Number(book.id) === Number(updatedBookResponse.id) ? { ...book, title:updatedBookResponse.title,
                description:updatedBookResponse.description,format:updatedBookResponse.format } : book
            )
          );
        }
      } else {
        navigate("/authors/list");
      }
    }
  }, [fetcher.data, navigate]);
  
  

  useEffect(() => {
    if (author) {
      const filtered:any = author?.books?.filter((book:Book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.format.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.release_date.includes(searchQuery)
      );
      setFilteredBooks(filtered);
    }
  }, [searchQuery, author]);

  const handleEditBook = (book: Book) => {
    setEditBook(book);
    setIsEditing(true);
  };

  const handleSaveBook = () => {
    if (editBook && author) {

      console.log("editBook",editBook);
      fetcher.submit(
        { ...editBook,authorId:Number(author?.id)},
        { method: "put" }
      );
     
    }
  };

  if (!author) {
    return <Spinner accessibilityLabel="Loading Author Details" size="large" />;
  }

  function handleDeleteBook(book:Book){

          if (author) {
          fetcher.submit(
            { ...book,authorId:author?.id},
            { method: "delete" }
          );
      }
  }

  const bookRows = filteredBooks.map((book) => [
    book.title,
    book.description,
    book.release_date.split("T")[0],
    book.isbn,
    book.format,
    book.number_of_pages.toString(),
    <>
      <Button onClick={() => handleEditBook(book)}>Edit</Button>
      <Button loading={loadingDelete} onClick={()=> handleDeleteBook(book)}>Delete</Button>
    </>,
  ]);

  return (
    <Page title="Author Details">
      <Card>
        <BlockStack gap="200">
          <InlineGrid columns="1fr auto">
            <Text as="h2" variant="headingSm">
              {author.first_name} {author.last_name}
            </Text>
            <ButtonGroup>
                <Button
                  onClick={() => navigate(`/authors/list`)}
                  accessibilityLabel="Back to Authors"
                  variant="secondary"
                >
                  Back to Authors
                </Button>
                <Button
                  onClick={() => navigate(`/books/add`)}
                  accessibilityLabel="Add New Book"
                  variant="primary"
                >
                  Add New Book
                </Button>
               
            </ButtonGroup>
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
      {isEditing && editBook && (
        <Modal
          open={isEditing}
          onClose={() => setIsEditing(false)}
          title="Edit Book"
          primaryAction={{ content: "Save", onAction: handleSaveBook,loading:loadingEdit }}
          secondaryActions={[{ content: "Cancel", onAction: () => setIsEditing(false) }]}
        >
          <Modal.Section>
            <FormLayout>
              <TextField   autoComplete="off" label="Title" value={editBook.title} onChange={(value) => setEditBook({ ...editBook, title: value })} />
              <TextField   autoComplete="off" label="Description" value={editBook.description} onChange={(value) => setEditBook({ ...editBook, description: value })} />
              <TextField   autoComplete="off" label="Genre" value={editBook.format} onChange={(value) => setEditBook({ ...editBook, format: value })} />
            </FormLayout>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
