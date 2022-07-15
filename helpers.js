//checks for existing user accounts that matches the registered emails in the users database
const getUserByEmail = function (email, database) {
  let foundUser = null
  for (let key in database) {
    if (database[key].email === email) {
      foundUser = database[key]
    }
  }
  return foundUser;
};

//Checks the urldatabase for user exclusive urls
function urlsForUser(id, urlDatabase) {
  let filteredDb = {};
  for (let key in urlDatabase) {
    let value = urlDatabase[key];
    if (id === value.userID) {
      filteredDb[key] = value;
    }
  }
  return filteredDb;
};

//generates a random string of 6 characters that will be used for user IDs and short urls
function generateRandomID() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};



module.exports = { getUserByEmail, generateRandomID, urlsForUser };

