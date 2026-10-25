# Interview Guide

## Why raw SQL?

The project uses `pg` with parameterized SQL to meet the specification and keep query behavior explicit.

## How is overselling prevented?

Each purchase runs in a transaction and performs `UPDATE vehicles SET quantity = quantity - $2 WHERE id = $1 AND quantity >= $2 RETURNING *`. PostgreSQL row locking makes concurrent requests compete safely; the purchase record is inserted before commit.

## How is history preserved?

Purchases keep vehicle make, model, category, and prices as snapshots. The vehicle foreign key uses `ON DELETE SET NULL`.

## How is privilege escalation prevented?

Public registration ignores arbitrary role fields and always inserts `user`. Admin routes enforce the role from the validated JWT.
