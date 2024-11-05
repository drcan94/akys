describe('Notification System', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
    cy.visit('/dashboard');
  });

  it('displays notification badge with unread count', () => {
    cy.get('[data-testid="notification-badge"]')
      .should('be.visible')
      .and('have.text', '2');
  });

  it('shows notification dropdown when clicked', () => {
    cy.get('[data-testid="notification-button"]').click();
    cy.get('[data-testid="notification-dropdown"]')
      .should('be.visible')
      .within(() => {
        cy.contains('Bildirimler').should('be.visible');
        cy.get('[data-testid="notification-item"]').should('have.length.at.least', 1);
      });
  });

  it('marks notifications as read when clicked', () => {
    cy.get('[data-testid="notification-button"]').click();
    cy.get('[data-testid="notification-item"]').first().click();
    cy.get('[data-testid="notification-badge"]')
      .should('have.text', '1');
  });

  it('navigates to correct page when notification clicked', () => {
    cy.get('[data-testid="notification-button"]').click();
    cy.get('[data-testid="notification-item"]')
      .contains('Yeni Operasyon Notu')
      .click();
    cy.url().should('include', '/dashboard/patients');
  });

  it('allows marking all notifications as read', () => {
    cy.get('[data-testid="notification-button"]').click();
    cy.get('[data-testid="mark-all-read-button"]').click();
    cy.get('[data-testid="notification-badge"]').should('not.exist');
  });

  it('shows empty state when no notifications', () => {
    cy.get('[data-testid="notification-button"]').click();
    cy.get('[data-testid="mark-all-read-button"]').click();
    cy.get('[data-testid="notification-button"]').click();
    cy.contains('Bildirim bulunmuyor').should('be.visible');
  });

  it('updates notification settings', () => {
    cy.visit('/settings/notifications');
    
    // Toggle notification settings
    cy.get('[data-testid="operation-notes-switch"]').click();
    cy.get('[data-testid="messages-switch"]').click();
    
    // Save settings
    cy.get('button').contains('Kaydet').click();
    
    // Verify settings are persisted
    cy.reload();
    cy.get('[data-testid="operation-notes-switch"]').should('not.be.checked');
    cy.get('[data-testid="messages-switch"]').should('not.be.checked');
  });

  it('handles push notification permissions', () => {
    cy.visit('/settings/notifications');
    
    // Mock notification permission request
    cy.window().then((win) => {
      cy.stub(win.Notification, 'requestPermission').resolves('granted');
    });
    
    cy.get('[data-testid="push-notifications-switch"]').click();
    cy.contains('Bildirimler başarıyla etkinleştirildi').should('be.visible');
  });

  it('shows warning when disabling emergency notifications', () => {
    cy.visit('/settings/notifications');
    cy.get('[data-testid="emergency-alerts-switch"]').click();
    cy.contains('Önemli Uyarı').should('be.visible');
    cy.contains('Acil durum bildirimlerini kapatmak').should('be.visible');
  });

  it('receives real-time notifications', () => {
    // Create a new operation note in another session
    cy.task('createOperationNote', {
      patientId: 'test-patient',
      userId: 'other-user',
    });

    // Verify notification is received
    cy.get('[data-testid="notification-badge"]')
      .should('be.visible')
      .and('have.text', '1');
    
    cy.get('[data-testid="notification-button"]').click();
    cy.contains('Yeni Operasyon Notu').should('be.visible');
  });
});