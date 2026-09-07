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

  it('uses AI to categorize unknown items and caches the result', async () => {
    // Clear localStorage before test
    localStorage.clear();

    // Mock onSnapshot to immediately return empty list
    firestore.onSnapshot.mockImplementation((colRef, callback) => {
      callback({
        empty: false, // Prevents seeding initial items
        forEach: () => {},
      });
      return vi.fn(); // Return unsubscribe function
    });

    const { geminiModel } = await import('../firebase');

    // Mock the AI response for a new unknown item
    geminiModel.generateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify({ category: "Produce", location: "Primeur" })
      }
    });

    render(<App />);

    // Enter a new unknown item
    const input = screen.getByPlaceholderText(/e.g. Almond Milk/i);
    fireEvent.change(input, { target: { value: 'Dragonfruit' } });

    // Submit the form
    const addButton = screen.getByRole('button', { name: /Add to Shopping List/i });
    fireEvent.click(addButton);

    // Wait for the AI categorization to complete and addDoc to be called
    await waitFor(() => {
      expect(geminiModel.generateContent).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(firestore.addDoc).toHaveBeenCalledTimes(1);
    });

    // Check that it was categorized using the AI response
    const addedItemData = firestore.addDoc.mock.calls[0][1];
    expect(addedItemData.name).toBe('Dragonfruit');
    expect(addedItemData.category).toBe('Produce');
    expect(addedItemData.location).toBe('Primeur');

    // Add the same item again
    fireEvent.change(input, { target: { value: 'dragonfruit' } });
    fireEvent.click(addButton);

    // Wait for the second addDoc
    await waitFor(() => {
      expect(firestore.addDoc).toHaveBeenCalledTimes(2);
    });

    // Verify AI was NOT called again because it was cached
    expect(geminiModel.generateContent).toHaveBeenCalledTimes(1);

    // Check that the cached categorization was used
    const addedItemData2 = firestore.addDoc.mock.calls[1][1];
    expect(addedItemData2.name).toBe('dragonfruit');
    expect(addedItemData2.category).toBe('Produce');
    expect(addedItemData2.location).toBe('Primeur');
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
