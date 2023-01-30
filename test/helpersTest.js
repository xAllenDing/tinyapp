const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    const userID = user.id
    // Write your assert statement here
    assert.strictEqual(userID, expectedUserID);
  });
  it("should return undefined from a non-existing email", function() {
    const user = getUserByEmail("wrongemail@exmaple.com", testUsers);
    const expected = undefined;
    assert.strictEqual(user, expected);
  })
});