
create or replace function addbook(text,text,text) returns void as
$BODY$
DECLARE
idcount int;
idcount2 int;
myid alias for $1;
mynm alias for $2;
myau alias for $3;
BEGIN
	IF (myid <> '' AND mynm <> '')
	THEN
		idcount = (SELECT COUNT(*) FROM books WHERE books.id=myid);

		IF (idcount < 1)
		THEN
			INSERT INTO books VALUES(myid, mynm, myau);
		ELSE
			UPDATE books SET name=mynm, author=myau WHERE id=myid;
		END IF;
	END IF;
END;
$BODY$
LANGUAGE plpgsql
;
