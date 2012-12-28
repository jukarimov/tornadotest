CREATE OR REPLACE FUNCTION updbook(
  inid       BIGINT,
  ibook      TEXT,
  iauthor    TEXT,
  icategory  TEXT,
  ipublished DATE) RETURNS VOID AS $$
DECLARE
icatid BIGINT;
BEGIN
  IF (
    ibook <> '' AND
    iauthor <> '' AND
    icategory <> '' AND
    TEXT(ipublished) <> '')
  THEN
    icatid:= addcat(icategory);
    UPDATE books SET
      book      = ibook,
      author    = iauthor,
      catid     = icatid,
      published = ipublished WHERE id = inid;
  END IF;
END;
$$
LANGUAGE plpgsql;
