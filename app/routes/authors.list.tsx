import { LoaderFunction, defer, redirect } from "@remix-run/node";
import { useLoaderData, Form, useSearchParams, Link, Await } from "@remix-run/react";
import { Suspense, useEffect, useState } from "react";
import { getSession } from "../session.server";
import { Page, Card, DataTable, Button, Pagination, Spinner, BlockStack, InlineGrid, ButtonGroup } from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
import { logger } from "../logger";

interface Author {
  id: number;
  first_name: string;
  last_name: string;
  birthday: string;
  biography: string;
  gender: string;
  place_of_birth: string;
  book_count: number;
  books?: [];
}

interface AuthorsData {
  items: Author[];
  total_pages: number;
  current_page: number;
}

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

  const authorsDataPromise = fetch(`${process.env.BASEURL}/authors?orderBy=id&direction=ASC&limit=10&page=${page}`, {
    headers: {
      "Accept": "application/json",
      "Authorization": token,
    },
  }).then((res) => res.json());

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

  return defer({
    authorsDataPromise: authorsDataPromise,
    authorsWithBooksPromise: authorsWithBooksPromise,
  });
};

export default function AuthorsList() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);

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

  const handlePageChange = (newPage: number) => {
    setIsPaginating(true);
    setCurrentPage(newPage);
    setSearchParams({ page: String(newPage) });

    // Simulate loading time to show spinner
    setTimeout(() => {
      setIsPaginating(false);
    }, 500);
  };

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
              </Form>,
            ]);

            return (
              <BlockStack gap="200">
                <Card>
                  <BlockStack gap="200">
                    <InlineGrid columns="1fr auto">
                      <ButtonGroup>
                        <Button
                          onClick={() => navigate(`/books/add`)}
                          accessibilityLabel="Add New Book"
                          variant="primary"
                        >
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
            );
          }}
        </Await>
      </Suspense>
    </Page>
  );
}
