CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE IF NOT EXISTS users (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
first_name TEXT NOT NULL,
last_name TEXT NOT NULL,
username TEXT NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
account_created TIMESTAMPTZ NOT NULL DEFAULT now(),
account_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS products (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name TEXT NOT NULL,
description TEXT NOT NULL,
sku TEXT NOT NULL,
manufacturer TEXT NOT NULL,
quantity INTEGER NOT NULL CHECK (quantity >= 0),
date_added TIMESTAMPTZ NOT NULL DEFAULT now(),
date_last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE
); 

CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_owner ON products(sku, owner_user_id);

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS images (
  image_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  owner_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name      TEXT NOT NULL,
  s3_bucket_path TEXT NOT NULL,   -- key only (not a full s3:// url)
  date_created   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS images_product_idx ON images(product_id);
CREATE INDEX IF NOT EXISTS images_owner_idx   ON images(owner_id);