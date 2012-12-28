CREATE OR REPLACE FUNCTION addbook(book TEXT, author TEXT, category TEXT, published DATE) RETURNS VOID AS $$
DECLARE
catid BIGINT;
BEGIN
  catid:= addcat(category);
		INSERT INTO books (
		  book,
				author,
				catid,
				published) VALUES(
		    book,
				  author,
				  catid,
				  published
		  );
END;
$$
LANGUAGE plpgsql;
