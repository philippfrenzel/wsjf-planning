describe('Public auth navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('navigates to login page from home', () => {
    cy.contains('nav a', 'Log in').click();
    cy.url().should('include', '/login');
  });

  it('navigates to register page from home', () => {
    cy.contains('nav a', 'Register').click();
    cy.url().should('include', '/register');
  });
});
