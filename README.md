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

Would you like any modifications or improvements? 🚀

