DROP   VIEW   IF EXISTS api.book_list;
DROP   TABLE  IF EXISTS schemas.book     CASCADE;
DROP   TABLE  IF EXISTS schemas.category CASCADE;
DROP   SEQUENCE IF EXISTS schemas.id_generator;
DROP   SCHEMA IF EXISTS schemas          CASCADE;
CREATE SCHEMA schemas; 

CREATE TABLE schemas.book (
  id           BIGSERIAL PRIMARY KEY,
  category_id  BIGINT    NOT NULL,
  published    DATE      NOT NULL,
  author       VARCHAR   NOT NULL,
  name         VARCHAR   NOT NULL,
  UNIQUE(category_id, published, author, name),
  CHECK (TEXT(published) <> ''),
  CHECK (author <> ''),
  CHECK (name <> '')
);

CREATE SEQUENCE schemas.id_generator;
CREATE TABLE schemas.category (
  category_id  BIGINT PRIMARY KEY REFERENCES schemas.book ON DELETE CASCADE ON UPDATE RESTRICT,
  name         VARCHAR   NOT NULL,
  UNIQUE(name),
  CHECK (name <> '')
);

DROP   SCHEMA IF EXISTS api CASCADE;
CREATE SCHEMA api;

CREATE OR REPLACE FUNCTION api.book_add(
  in_category  VARCHAR,
  in_published DATE,
  in_author    VARCHAR,
  in_name      VARCHAR
) RETURNS VOID AS $$
DECLARE
in_category_id BIGINT;
BEGIN
  SELECT category_id
  INTO
    in_category_id
  FROM
    schemas.category
  WHERE
    name = in_category;
  IF (NOT FOUND)
  THEN
    SELECT nextval('schemas.id_generator') INTO in_category_id;
    INSERT INTO schemas.book (
      category_id,
      published,
      author,
      name
    )
    VALUES (
      in_category_id,
      in_published,
      in_author,
      in_name
    );
    INSERT INTO schemas.category (
      category_id,
      name
    )
    VALUES (
      in_category_id,
      in_category
    );
  ELSE
    INSERT INTO schemas.book (
      category_id,
      published,
      author,
      name
    )
    VALUES (
      in_category_id,
      in_published,
      in_author,
      in_name
    );
  END IF;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION api.book_update(
  in_id        BIGINT,
  in_category  VARCHAR,
  in_published DATE,
  in_author    VARCHAR,
  in_name      VARCHAR
) RETURNS VOID AS $$
DECLARE
in_category_id BIGINT;
tmp            BIGINT;
tmp_name       VARCHAR;
BEGIN
  SELECT
  category_id
  INTO
  in_category_id
  FROM
  schemas.book
  WHERE
  id = in_id;

  SELECT
  name
  INTO
  tmp_name
  FROM
  schemas.category
  WHERE
  category_id = in_category_id;

  IF (in_category <> tmp_name)
  THEN
    IF (in_category in (SELECT name FROM schemas.category))
    THEN
      tmp := (SELECT category_id FROM schemas.category WHERE name = in_category);
      UPDATE schemas.book
      SET
        category_id = tmp
      WHERE id = in_id;
    ELSE
      SELECT COUNT(*) INTO tmp FROM schemas.book WHERE category_id = in_category_id;
      IF (tmp < 2)
      THEN
        UPDATE schemas.category
        SET
        name        = in_category
        WHERE
        category_id = in_category_id;
      ELSE
        in_category_id := (SELECT nextval('schemas.id_generator'));
        UPDATE schemas.book
        SET
        category_id = in_category_id
        WHERE
        id = in_id;
        INSERT INTO schemas.category (
          category_id,
          name
        ) VALUES (
        in_category_id,
        in_category
        );
      END IF;
    END IF;
  END IF;

  UPDATE schemas.book
  SET
  published = in_published,
  author    = in_author,
  name      = in_name
  WHERE id = in_id;
END;
$$
LANGUAGE plpgsql;

CREATE VIEW api.book_list
AS
  SELECT
    b.id,
    c.name AS category,
    b.published,
    b.author,
    b.name
  FROM
    schemas.book AS b
  JOIN
    schemas.category AS c
  ON
    c.category_id = b.category_id;

GRANT SELECT        ON api.book_list                 TO pguser;
GRANT USAGE         ON SCHEMA schemas                TO pguser;
GRANT USAGE         ON SCHEMA api                    TO pguser;
GRANT ALL           ON schemas.book                  TO pguser;
GRANT ALL           ON schemas.category              TO pguser;
GRANT USAGE, SELECT ON SEQUENCE schemas.id_generator TO pguser;
GRANT USAGE, SELECT ON SEQUENCE schemas.book_id_seq  TO pguser;
