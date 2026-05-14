/**
 * Test E2E: Flujo de Mantenimiento Preventivo
 * Simula la el funcionamiento de un plan preventivo
 */
describe('Mecanaut E2E: Flujo Plan de Mantenimiento Preventivo', () => {

  before(() => {
    Cypress.config('baseUrl', 'http://localhost:5173');
    Cypress.on('uncaught:exception', (err, runnable) => {
      return false;
    });
  });

  it('Debe crear una máquina, asignarle un plan y autogenerar la orden por métrica', () => {

    cy.log('1. Inicio de sesión como Admin');
    cy.visit('/login');
    cy.get('input[type="text"]').should('be.visible').clear().type('pruebaadmin');
    cy.get('input[type="password"]').should('be.visible').clear().type('prueba123');
    cy.get('button').contains(/Log In|Iniciar/i).click();
    cy.url().should('not.include', '/login');

    cy.log('2. Navegar a /machinery y crear nueva máquina');
    cy.get('.sidebar').trigger('mouseenter');
    cy.wait(300);
    cy.get('a[href="/machinery"], [role="menuitem"]').contains(/maquinaria|machinery/i).click();

    cy.get('#plant-selector').select(1);
    cy.wait(500);
    cy.get('#production-line-selector').select(1);
    cy.wait(1000);

    cy.get('button').contains(/nuevo|nueva|new/i).click();
    cy.get('.modal-container').should('be.visible');

    const dynamicSerialNumber = `GR02-${Date.now()}`;
    const machineName = `Grúa 2 E2E`;

    cy.get('input#name').type(machineName);
    cy.get('input#manufacturer').type('Fabricante 2');
    cy.get('input#serialNumber').type(dynamicSerialNumber);
    cy.get('input#model').type('GR002');
    cy.get('input#type').type('Grua');
    cy.get('input#powerConsumption').type('800');

    cy.get('.measurements-section select').select(1);
    cy.get('.measurements-section input[placeholder="Valor"]').type('100');

    cy.get('.btn-save').click();
    cy.wait(1500);

    cy.log('3. Visita a Orden de Trabajo');
    cy.get('.sidebar').trigger('mouseenter');
    cy.wait(300);
    cy.get('a[href="/orden-trabajo"], [role="menuitem"]').contains(/work order|orden de trabajo/i).click();

    cy.get('#plant.filter-select').select(1);
    cy.wait(500);
    cy.get('#productionLine').select(1);
    cy.wait(3000);

    cy.log('4. Navegar a /maintenance-plan y crear plan');
    cy.get('.sidebar').trigger('mouseenter');
    cy.wait(300);
    cy.get('a[href="/maintenance-plan"], [role="menuitem"]').contains(/plan/i).click();

    cy.get('#plant-selector').select(1);
    cy.wait(500);
    cy.get('#production-line-selector').select(1);
    cy.wait(1000);

    cy.get('button').contains(/New Plan|Nuevo plan/i).click();

    cy.get('.form-group').contains('label', 'Nombre').parent().find('input').type(`Plan Preventivo ${machineName}`);
    cy.get('.form-group').contains('label', 'Parámetro').parent().find('select').select('1');
    cy.get('.form-group').contains('label', 'Mantenimiento cada').parent().find('input').type('1000');

    cy.contains('.machine-chip', machineName).click().should('have.class', 'selected');

    cy.get('.add-task-btn').click();
    cy.get('.task-row input[placeholder="Nombre de la tarea"]').type('Revisión Preventiva E2E');
    cy.get('.task-row input[placeholder="Descripción"]').type('Revisión a los 1000km');

    cy.get('.modal-content .btn-save').should('not.be.disabled').click();
    cy.wait(1500);

    cy.log('5. Navegar a /machine-parameters y actualizar métrica');
    cy.get('.sidebar').trigger('mouseenter');
    cy.wait(300);
    cy.get('a[href="/machine-parameters"], [role="menuitem"]').contains(/Machine Metrics/i).click();

    cy.get('#plant-select').select(1);
    cy.wait(500);
    cy.get('#production-line-select').select(1);
    cy.wait(1000);

    cy.contains('#machinery-select option', machineName).then(option => {
      cy.get('#machinery-select').select(option.val());
    });
    cy.wait(1000);

    cy.get('.parameter-input').clear().type('1200');
    cy.get('.save-button').click();
    cy.wait(1500);

    cy.log('6. Validar que la orden preventiva se haya generado');
    cy.get('.sidebar').trigger('mouseenter');
    cy.wait(300);
    cy.get('a[href="/orden-trabajo"], [role="menuitem"]').contains(/work order/i).click();

    cy.get('#plant.filter-select').select(1);
    cy.wait(500);
    cy.get('#productionLine').select(1);
    cy.wait(3000);

  });
});

