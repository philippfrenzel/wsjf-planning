describe('Home page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays the heading and auth links', () => {
    cy.contains('h1', 'WSJF Planning').should('be.visible');
    cy.contains('nav a', 'Log in').should('be.visible');
    cy.contains('nav a', 'Register').should('be.visible');
  });

  it('shows feature sections', () => {
    cy.contains('h3', 'WSJF Priorisierung').should('be.visible');
    cy.contains('h3', 'Sprint Planung').should('be.visible');
    cy.contains('h3', 'Transparente Zusammenarbeit').should('be.visible');
    cy.contains('h3', 'Auswertungen').should('be.visible');
  });

  it('has a hero background image', () => {
    cy.contains('h1', 'WSJF Planning')
      .parents('section')
      .first()
      .should('have.css', 'background-image')
      .and('match', /wsjf_planning_teaser\.png/);
  });
});
