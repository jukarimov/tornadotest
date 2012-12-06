drop table books;
create table books(id text unique not NULL, name TEXT not NULL, author TEXT not NULL);
grant all on books to pguser;
