CREATE OR REPLACE FUNCTION addbook(myid TEXT, mynm TEXT, myau TEXT) RETURNS VOID AS
$$
DECLARE
mytmp TEXT;
BEGIN
	IF (myid <> '' AND mynm <> '')
	THEN
		SELECT id INTO mytmp FROM books WHERE books.id=myid;

		IF (NOT FOUND)
		THEN
			INSERT INTO books VALUES(myid, mynm, myau);
		ELSE
			UPDATE books SET name=mynm, author=myau WHERE id=myid;
		END IF;
	END IF;
END;
$$
LANGUAGE plpgsql
;
