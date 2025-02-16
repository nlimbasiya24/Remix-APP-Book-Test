Overview:

This is a Remix-based web application that allows users to log in, manage authors, and interact with book data. The app integrates with a backend API for authentication, data retrieval, and updates.

Features

✅ User Authentication
✅ Author Management (List, View, Delete)
✅ Book Management (Add, Edit, Delete)
✅ Search and Filtering
✅ Optimized API Calls & Pagination


Authentication Flow

![alt text](<Screenshot 2025-02-16 at 7.33.36 PM.png>)


Code Reference: [login.tsx]

This function handles user authentication by sending a POST request to the API.

```javascript
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

How It Works
Retrieves user credentials (email, password) from the form.
Sends a POST request to authenticate the user.
If authentication fails, returns an error.
If successful, saves the token and user data in the session.
Redirects to /authors/list after successful login.

Usage:

This function should be placed in your routes/login.tsx file.
Ensure session management (session.server.ts) is properly set up.
Use this function inside your Remix Form with method="post".

```



![alt text](<Screenshot 2025-02-16 at 7.49.02 PM-1.png>)


Overview
This Remix component is a Paginated Authors List that allows users to view a list of authors, check their book count, and perform actions like adding a book or deleting an author.

The UI in the provided image aligns with this functionality, displaying:

A welcome message with the logged-in user's name (Rahul Patelwerr).   
A table of authors, with columns for:     
Name (links to detailed author profiles).   
Book Count (number of books written by the author).   
Actions (Delete button).    
An "Add New Book" button to allow users to create a new book.   
Pagination controls at the bottom to navigate between pages.    

How the Code Works
1️⃣ Fetching Authors Data (Loader Function)

```javascript
export const loader: LoaderFunction = async ({ request }) => {
  logger.info("Inside Loading function of Loader");
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) {
    return redirect("/login");
  }

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";

  logger.info(`Fetching authors data for page ${page}`);

  const authorsDataPromise = fetch(`https://candidate-testing.com/api/v2/authors?orderBy=id&direction=ASC&limit=12&page=${page}`, {
    headers: {
      "Accept": "application/json",
      "Authorization": token,
    },
  }).then((res) => res.json());

  ```
  What this does:

Checks if the user is logged in. If not, redirects to /login.
Fetches authors data from the API, using pagination (i.e., 12 authors per page).
Logs the fetching process.

2️⃣ Fetching Books for Each Author

```javascript

const authorsWithBooksPromise = authorsDataPromise.then(async (authorsData: AuthorsData) => {
  return Promise.all(
    authorsData.items.map(async (author: Author) => {
      const authorResponse = await fetch(`${process.env.BASEURL}/authors/${author.id}`, {
        headers: {
          "Accept": "application/json",
          "Authorization": token,
        },
      });
      const authorDetail = await authorResponse.json();
      return { ...author, book_count: authorDetail.books.length, books: authorDetail.books };
    })
  );
});

```

📌 What this does:

After fetching authors, it fetches book details for each author.    
The book_count is updated to reflect the number of books.

3️⃣ Updating the UI with Fetched Data

```javascript

useEffect(() => {
  if (loaderData.authorsWithBooksPromise) {
    loaderData.authorsWithBooksPromise.then((authors: any) => {
      localStorage.setItem("authorsData", JSON.stringify(authors));
      setIsLoading(false);
    });
  }
  loaderData.authorsDataPromise.then((data: AuthorsData) => {
    setTotalPages(data.total_pages);
  });
}, [loaderData]);
```

📌 What this does:

Saves authors data in localStorage for offline access.
Disables the loading state (setIsLoading(false)) once data is fetched.
Updates totalPages for pagination.


4️⃣ Handling Pagination

```javascript
const handlePageChange = (newPage: number) => {
  setIsPaginating(true);
  setCurrentPage(newPage);
  setSearchParams({ page: String(newPage) });

  // Simulate loading time to show spinner
  setTimeout(() => {
    setIsPaginating(false);
  }, 500);
};

```

📌 What this does:

  Updates the current page number.    
  Updates URL parameters (searchParams) to reflect the new page.    
Shows a spinner (isPaginating) while loading the next page.   
🔹 In the Image:    
You can see pagination controls at the bottom (though disabled here because there's only one page).

5️⃣ Rendering the Authors Table

```javascript

const rows = authors.map((author) => [
  <Link to={`/authors/${author.id}`}>{`${author.first_name} ${author.last_name}`}</Link>,
  author.book_count,
  <Form method="post">
    <input type="hidden" name="authorId" value={String(author.id)} />
    <Button submit variant="primary" tone="critical" disabled={author.book_count > 0}>
      Delete
    </Button>
  </Form>,
]);
```

📌 What this does:

Displays author names as clickable links (redirects to the author's detail page).   
Shows book count.   
Disables the Delete button if the author has books.   
🔹 In the Image:    
The delete button is disabled for authors with books (like David Goggins), but enabled for those without books (like Virat Kohli).

6️⃣ Displaying the UI


  ```javascript

  <Page title="Authors">
  <Suspense fallback={<Spinner accessibilityLabel="Loading Authors" size="large" />}>
    <Await resolve={loaderData.authorsWithBooksPromise}>
      {(authors: Author[]) => (
        <BlockStack gap="200">
          <Card>
            <BlockStack gap="200">
              <InlineGrid columns="1fr auto">
                <ButtonGroup>
                  <Button onClick={() => navigate(`/books/add`)} accessibilityLabel="Add New Book" variant="primary">
                    Add New Book
                  </Button>
                </ButtonGroup>
              </InlineGrid>
              {isLoading ? (
                <Spinner accessibilityLabel="Loading Authors Data" size="large" />
              ) : (
                <DataTable 
                  columnContentTypes={["text", "numeric", "text"]} 
                  headings={["Name", "Book Count", "Actions"]} 
                  rows={rows} 
                />
              )}
            </BlockStack>
          </Card>
          <Pagination
            hasPrevious={currentPage > 1}
            onPrevious={() => handlePageChange(currentPage - 1)}
            hasNext={currentPage < totalPages}
            onNext={() => handlePageChange(currentPage + 1)}
          />
          {isPaginating && <Spinner accessibilityLabel="Loading next page..." size="large" />}
        </BlockStack>
      )}
    </Await>
  </Suspense>
</Page>
```

📌 What this does:

Shows a spinner while loading authors (isLoading).    
Renders a table of authors using DataTable.   
Includes a pagination system.   
🔹 In the Image:    
"Add New Book" button is visible (top left of the table).   
Author list is displayed in a table format.   
Pagination controls are shown at the bottom, but inactive due to one-page data.

🚀 Final Summary

✔ User is authenticated before fetching authors.     
✔ Authors data is fetched, stored in localStorage, and displayed.    
✔ Books count is dynamically updated based on fetched data.    
✔ Pagination allows easy navigation between pages.   
✔ Loading state (Spinner) is used when fetching or paginating.   
✔ Delete button is disabled if the author has books (as seen in the image).


![alt text](<Screenshot 2025-02-16 at 8.14.57 PM.png>)

```javascript

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
```


Authentication Check: Redirects to login if no token is found.    
Fetching & Displaying Authors: Reads author data from localStorage and updates the UI.    
Search & Filter Books: Filters books based on title, format, or release date.     
Edit & Delete Books: Uses fetcher.submit() to update or remove books from the backend API.    
LocalStorage Updates: Syncs book changes to localStorage after API responses.   
UI Components: Uses Shopify Polaris for UI (modals, tables, buttons, etc.).   
Navigation: Allows adding books, editing details, and returning to the author list. 


![alt text](<Screenshot 2025-02-16 at 8.28.51 PM.png>)

edit author

![alt text](<Screenshot 2025-02-16 at 8.30.43 PM.png>)



```javascript

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
```

Auth Check: Redirects to /login if no token.  
Form Submission: Sends a POST request to add a book.    
State Management: Stores authors, selected author, and book details.    
LocalStorage: Loads authors, defaults to the first one.   
UI: Uses Polaris UI, fetcher.Form, and a loading button.    
Redirects: On success, goes to /authors/list.   