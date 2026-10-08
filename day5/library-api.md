# Library API Design

A REST API for a library's **books** resource. Base path: `/books`. All bodies use JSON.

## Endpoints

### 1. List all books
- **Method:** GET
- **Path:** `/books`
- **Description:** Returns every book in the library.
- **Request body:** none
- **Success status:** 200 OK

### 2. Get one book
- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Returns a single book by its id.
- **Request body:** none
- **Success status:** 200 OK

### 3. Create a book
- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Example request body:**
```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1958
  }
```
- **Success status:** 201 Created

### 4. Update a book (full replace)
- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Replaces all fields of an existing book.
- **Example request body:**
```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1959
  }
```
- **Success status:** 200 OK

### 5. Delete a book
- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Removes a book from the library.
- **Request body:** none
- **Success status:** 204 No Content

### 6. List books by author
- **Method:** GET
- **Path:** `/books?author=Chinua%20Achebe`
- **Description:** Returns only the books written by the author given in the query parameter.
- **Request body:** none
- **Success status:** 200 OK

## Error codes

- **400 Bad Request**
  - Happens when the request is invalid.
  - Example: `POST /books` with a missing `title`, or a `year` sent as text such as `"abc"`.
- **404 Not Found**
  - Happens when the requested resource does not exist.
  - Example: `GET /books/9999` when no book has the id 9999.
