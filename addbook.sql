
create or replace function addbook(text,text,text) returns void as
$BODY$
DECLARE
idcount int;
myid alias for $1;
mynm alias for $2;
myau alias for $3;
BEGIN
	idcount = (SELECT COUNT(*) FROM books WHERE books.id=myid);
	IF (idcount < 1)
	THEN
		IF (myid <> '' AND mynm <> '')
		THEN
			INSERT INTO books VALUES(myid, mynm, myau);
		END IF;
	END IF;
END;
$BODY$
LANGUAGE plpgsql
;
