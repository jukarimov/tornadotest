DROP TABLE books;
CREATE TABLE books(id TEXT UNIQUE NOT NULL, name TEXT NOT NULL, author TEXT NOT NULL);
GRANT ALL ON books TO pguser;