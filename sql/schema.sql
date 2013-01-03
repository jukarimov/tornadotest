DROP   TABLE  schemas.book;
DROP   TABLE  schemas.category;
DROP   SCHEMA schemas CASCADE; 
CREATE SCHEMA schemas; 

CREATE TABLE schemas.book (
  id          BIGSERIAL NOT NULL PRIMARY KEY,
  published   DATE      NOT NULL,
  category_id BIGINT    NOT NULL,
  author      VARCHAR   NOT NULL,
  name        VARCHAR   NOT NULL,
  UNIQUE(published, author, name)
);

CREATE TABLE schemas.category (
  id          BIGSERIAL NOT NULL PRIMARY KEY,
  name        VARCHAR   NOT NULL,
  UNIQUE(name)
);

DROP   SCHEMA   api CASCADE;
CREATE SCHEMA   api; 

CREATE OR REPLACE FUNCTION api.category_add(
  in_name VARCHAR
) RETURNS BIGINT AS $$
DECLARE
tmp BIGINT;
BEGIN
  tmp:= 0;
  IF (in_name <> '')
  THEN
    SELECT id INTO tmp FROM schemas.category WHERE name = in_name;
    IF (NOT FOUND)
    THEN
      INSERT INTO schemas.category (
        name
      )
      VALUES (
        in_name
      ) RETURNING id INTO tmp;
    END IF;
  END IF;
  RETURN tmp;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION api.book_add(
  in_published DATE,
  in_category  TEXT,
  in_author    TEXT,
  in_name      TEXT
) RETURNS VOID AS $$
DECLARE
in_category_id BIGINT;
BEGIN
  in_category_id:= api.category_add(in_category);
  INSERT INTO schemas.book (
    published,
    category_id,
    author,
    name
  )
  VALUES (
    in_published,
    in_category_id,
    in_author,
    in_name
  );
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION api.book_update(
  in_id        BIGINT,
  in_published DATE,
  in_category  TEXT,
  in_author    TEXT,
  in_name      TEXT
) RETURNS VOID AS $$
DECLARE
in_category_id BIGINT;
BEGIN
  IF (
    TEXT(in_published) <> '' AND
    in_category <> ''        AND
    in_author <> ''          AND
    in_name <> ''
  )
  THEN
    in_category_id:= api.category_add(in_category);
    UPDATE schemas.book
    SET
      published   = in_published,
      category_id = in_category_id,
      author      = in_author,
      name        = in_name
    WHERE
      id          = in_id;
  END IF;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION api.book_list()
RETURNS TABLE (
  id         BIGINT,
  published  DATE,
  category   VARCHAR,
  author     VARCHAR,
  name       VARCHAR
) AS $$
BEGIN
  RETURN QUERY SELECT
    b.id,
    b.published,
    c.name AS category,
    b.author,
    b.name
  FROM
    schemas.book AS b
  JOIN
    schemas.category AS c
  ON
    c.id = b.category_id;
END;
$$
LANGUAGE plpgsql;

GRANT USAGE  ON SCHEMA schemas   TO pguser;
GRANT USAGE  ON SCHEMA api       TO pguser;
GRANT ALL    ON schemas.book     TO pguser;
GRANT ALL    ON schemas.category TO pguser;
GRANT USAGE, SELECT ON SEQUENCE schemas.category_id_seq TO pguser;
GRANT USAGE, SELECT ON SEQUENCE schemas.book_id_seq TO pguser;
