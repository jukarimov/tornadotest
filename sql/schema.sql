DROP   VIEW     IF EXISTS api.book_list;
DROP   TABLE    IF EXISTS schemas.book          CASCADE;
DROP   TABLE    IF EXISTS schemas.category      CASCADE;
DROP   SEQUENCE IF EXISTS schemas.id_generator;
DROP   SCHEMA   IF EXISTS schemas               CASCADE;

CREATE SCHEMA             schemas;

CREATE TABLE schemas.category (
  id   BIGSERIAL PRIMARY KEY,
  name VARCHAR   NOT NULL,
  UNIQUE(name),
  CHECK (name <> '')
);

CREATE TABLE schemas.author (
  id   BIGSERIAL PRIMARY KEY,
  name VARCHAR   NOT NULL,
  UNIQUE(name),
  CHECK (name <> '')
);

CREATE TABLE schemas.book (
  id           BIGSERIAL PRIMARY KEY,
  category_id  BIGINT    NOT NULL REFERENCES schemas.category,
  published    DATE      NOT NULL,
  author_id    BIGINT    NOT NULL REFERENCES schemas.author,
  name         VARCHAR   NOT NULL,
  UNIQUE(category_id, published, author_id, name),
  CHECK (published > DATE('1900-1-1') AND
         published < DATE('2014-1-1')),
  CHECK (name <> '')
);


DROP   SCHEMA   IF EXISTS api CASCADE;
CREATE SCHEMA             api;

CREATE OR REPLACE FUNCTION api.book_add(
  in_category  VARCHAR,
  in_published DATE,
  in_author    VARCHAR,
  in_name      VARCHAR
) RETURNS BIGINT AS $$
DECLARE
in_category_id BIGINT;
in_author_id   BIGINT;
out_book_id    BIGINT;
BEGIN

  SELECT id
  INTO
  in_author_id
  FROM
  schemas.author
  WHERE
  name = in_author;
  IF (NOT FOUND)
  THEN
    INSERT INTO schemas.author(name)
    VALUES (in_author) RETURNING id INTO in_author_id;
  END IF;

  IF (
    EXISTS(
      SELECT * FROM api.book_list WHERE
      category    = in_category  AND
      published   = in_published AND
      author      = in_author    AND
      name        = in_name
    )
  ) THEN RETURN 0;
  END IF;

  SELECT id
  INTO
  in_category_id
  FROM
  schemas.category
  WHERE
  name = in_category;

  IF (NOT FOUND)
  THEN
    INSERT INTO schemas.category (name)
    VALUES (in_category)
    RETURNING
    id
    INTO
    in_category_id;

    INSERT INTO schemas.book (
      category_id,
      published,
      author_id,
      name
    ) VALUES (
      in_category_id,
      in_published,
      in_author_id,
      in_name
    ) RETURNING id INTO out_book_id;
  ELSE
    INSERT INTO schemas.book (
      category_id,
      published,
      author_id,
      name
    ) VALUES (
      in_category_id,
      in_published,
      in_author_id,
      in_name
    ) RETURNING id INTO out_book_id;
  END IF;
  RETURN out_book_id;
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
in_author_id   BIGINT;
tmp            BIGINT;
tmp_name       VARCHAR;
BEGIN

  SELECT
  id
  INTO
  in_author_id
  FROM
  schemas.author
  WHERE
  name = in_author;
  IF (NOT FOUND)
  THEN
    INSERT INTO schemas.author(name)
    VALUES (in_author) RETURNING id INTO in_author_id;
  END IF;

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
  id = in_category_id;

  IF (in_category <> tmp_name)
  THEN -- category changed
    IF (in_category in (SELECT name FROM schemas.category))
    THEN
      tmp := (SELECT id FROM schemas.category WHERE name = in_category);
      UPDATE schemas.book SET
      category_id = tmp
      WHERE    id = in_id;
    ELSE
      INSERT INTO schemas.category (name)
      VALUES (in_category)
      RETURNING
      id
      INTO
      in_category_id;

      UPDATE schemas.book SET
      category_id = in_category_id
      WHERE    id = in_id;
    END IF;
  END IF;
  -- update the rest
  UPDATE schemas.book
  SET
  published = in_published,
  author_id = in_author_id,
  name      = in_name
  WHERE
  id        = in_id;
END;
$$
LANGUAGE plpgsql;

CREATE VIEW api.book_list AS
  SELECT
  b.id,
  c.name AS category,
  b.published,
  a.name AS author,
  b.name
  FROM
  schemas.book     AS b
  JOIN
  schemas.category AS c
  ON
  c.id = b.category_id
  JOIN
  schemas.author a
  ON
  a.id = b.author_id;


GRANT SELECT        ON api.book_list                 TO pguser;
GRANT USAGE         ON SCHEMA schemas                TO pguser;
GRANT USAGE         ON SCHEMA api                    TO pguser;
GRANT ALL           ON schemas.book                  TO pguser;
GRANT ALL           ON schemas.category              TO pguser;
GRANT ALL           ON schemas.author                TO pguser;
GRANT USAGE, SELECT ON SEQUENCE schemas.category_id_seq TO pguser;
GRANT USAGE, SELECT ON SEQUENCE schemas.author_id_seq TO pguser;
GRANT USAGE, SELECT ON SEQUENCE schemas.book_id_seq              TO pguser;
