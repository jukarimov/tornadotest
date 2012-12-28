CREATE OR REPLACE FUNCTION addcat(catname TEXT) RETURNS BIGINT AS $$
DECLARE
tmp BIGINT;
BEGIN
		tmp:= 0;
  IF (catname <> '')
		  THEN
				  SELECT id INTO tmp FROM category WHERE cat = catname;
						IF (NOT FOUND) THEN
								  INSERT INTO category (cat) VALUES(catname) RETURNING id INTO tmp;
						END IF;
		END IF;
		RETURN tmp;
END;
$$
LANGUAGE plpgsql;

