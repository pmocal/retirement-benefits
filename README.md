# Retirement Benefits

## Screenshot
![screenshot.png](screenshot.png)

## How to use the Heroku version

The current admin account is username: `admin`, password: `admin`.

You can sign up for your own user account on the home page. Then you can submit retirement benefit elections and respond to the admin's actions.

Admin accounts have the ability to see different pages of the site and approve of the benefit elections of regular users.

## How to use your own version

You should create a `.env` file with the following MongoDB credentials: `DB_HOST`, `DB_USER`, and `DB_PASS`. The MongoDB collection must be named `retirement-benefits-fake` and the table should be named `users`.

To create an admin account, sign up a user account with the regular workflow. Then, edit that user in your MongoDB table so that their `SSN` field has a value of `"admin"`. When you sign in with that user account it will behave as an admin account.

### Enjoy!
