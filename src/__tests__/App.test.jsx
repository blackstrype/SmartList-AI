import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import * as firestore from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  geminiModel: {
    generateContent: vi.fn(),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  writeBatch: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error notification when deleting an item fails', async () => {
    // Mock onSnapshot to immediately return some initial items
    firestore.onSnapshot.mockImplementation((colRef, callback) => {
      callback({
        empty: false,
        forEach: (fn) => {
          fn({
            id: '1',
            data: () => ({
              name: 'Test Item',
              checked: false,
              category: 'Other',
              location: 'Supermarché',
              intervalDays: 0,
              createdAt: Date.now(),
            }),
          });
        },
      });
      return vi.fn(); // Return unsubscribe function
    });

    // Make deleteDoc throw an error
    const mockError = new Error('Mock delete failure');
    firestore.deleteDoc.mockRejectedValueOnce(mockError);

    // Spy on console.error to avoid polluting test output and to verify it was called
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    // Wait for the item to appear in the list
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    // Find the delete button
    // The delete button is an icon with the title "Delete from list"
    const deleteButton = screen.getByTitle('Delete from list');

    // Click the delete button
    fireEvent.click(deleteButton);

    // Wait for the error notification to appear
    await waitFor(() => {
      expect(screen.getByText('Error deleting item.')).toBeInTheDocument();
    });

    // Verify console.error was called with the expected arguments
    expect(consoleSpy).toHaveBeenCalledWith('Error deleting document from Firestore: ', mockError);

    consoleSpy.mockRestore();
  });
});
