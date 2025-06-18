describe('Home page', () => {
    it('displays the heading', () => {
        cy.visit('/');
        cy.contains('h1', 'WSJF Planning').should('be.visible');
    });
});
