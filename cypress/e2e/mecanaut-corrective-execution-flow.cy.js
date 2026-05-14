/**
 * Test E2E: Flujo de Orden de Trabajo Correctiva
 * Simula la creación y ejecución de una orden de trabajo 
 */
describe('Mecanaut E2E: Flujo Operativo Crítico Completo', () => {
  const uniqueCode = `WO-E2E-${Date.now()}`;

  before(() => {
    Cypress.config('baseUrl', 'http://localhost:5173');
    Cypress.on('uncaught:exception', (err, runnable) => {
      return false;
    });
  });

  it('Debe crear una orden de trabajo como Admin, asignarla, y luego completarla como Técnico', () => {

    cy.log('1. Inicio de sesión como Administrador');
    cy.visit('/login');
    cy.get('input[type="text"]').should('be.visible').clear().type('pruebaadmin');
    cy.get('input[type="password"]').should('be.visible').clear().type('prueba123');
    cy.get('button').contains(/Log In|Iniciar/i).click();
    cy.url().should('not.include', '/login');

    cy.log('2. Navegación a Órdenes de Trabajo');
    cy.get('.sidebar').trigger('mouseenter');
    cy.get('.sidebar').should('have.class', 'expanded');
    cy.wait(300);

    cy.get('a[href="/orden-trabajo"], [role="menuitem"]')
      .contains(/orden de trabajo|work orders/i)
      .should('be.visible')
      .click();
    cy.url().should('include', '/orden-trabajo');

    cy.log('3. Selección de Planta y Línea de Producción');
    cy.get('#plant.filter-select').select(1);
    cy.wait(500);
    cy.get('#productionLine').select(1);
    cy.wait(1000);

    cy.log('4. Crear Orden de Trabajo');
    cy.get('button').contains(/nuevo|nueva|new/i).click();
    cy.get('.modal-container').should('be.visible');

    cy.get('input#code').type(uniqueCode);
    const today = new Date().toISOString().split('T')[0];
    cy.get('input#date').type(today);

    cy.get('.machines-checkboxes .checkbox-item input[type="checkbox"]').first().check({ force: true });
    cy.get('.task-input input[type="text"]').type('Realizar revisión técnica E2E');
    cy.get('.add-task-button').click();

    cy.get('.modal-footer button.button-primary, .modal-footer button:last-child').click();
    cy.wait(1000);

    cy.log('5. Asignar Técnico (pruebatec) a la orden creada');
    cy.contains('tr', uniqueCode).within(() => {
      cy.get('button').first().click();
    });
    cy.get('.modal-container').should('be.visible');
    cy.contains('.checkbox-item', 'pruebatec')
      .find('input[type="checkbox"]')
      .check({ force: true });

    cy.get('.modal-footer button.button-primary, .modal-footer button:last-child').click();
    cy.wait(1000);

    cy.log('6. Cerrar Sesión del Admin');
    cy.get('.sidebar').trigger('mouseenter');
    cy.wait(300);
    cy.get('.sidebar-footer a i.pi-sign-out').click();
    cy.url().should('include', '/login');

    cy.log('7. Inicio de sesión como Técnico');
    cy.get('input[type="text"]').should('be.visible').clear().type('pruebatec');
    cy.get('input[type="password"]').should('be.visible').clear().type('prueba123');
    cy.get('button').contains(/Log In|Iniciar/i).click();
    cy.url().should('not.include', '/login');

    cy.log('8. Navegar a Ejecución');
    cy.get('.sidebar').trigger('mouseenter');
    cy.wait(300);
    cy.get('a[href="/execution"], [role="menuitem"]')
      .contains(/execution|ejecución/i)
      .should('be.visible')
      .click();
    cy.url().should('include', '/execution');

    cy.log('9. Seleccionar filtros y completar orden');
    cy.get('#plant-select').select(1);
    cy.wait(500);
    cy.get('#production-line-select').select(1);
    cy.wait(1500);

    cy.contains('.order-card', uniqueCode).within(() => {
      cy.get('.tasks-list .checkbox-label').click({ multiple: true, force: true });
      cy.get('textarea.observations-textarea').type('prueba con cypress');
      cy.get('.finish-btn').should('be.visible').click();
    });

    cy.log('10. Validación de finalización');
    cy.contains('.order-card', uniqueCode).should('not.exist');
  });
});
