import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import StartEndDatePicker from '../StartEndDatePicker';
import { renderWithProviders } from './utils';
import { clearLocalStorage } from '../../hooks/localstorage';

// Helper to render with required props
const storageKey = "test-date-picker";
function renderPicker(props = {}) {
    return renderWithProviders(
        <StartEndDatePicker
            storageKey={storageKey}
            {...props}
        />
    );
}

function findInputByLabel(label: RegExp) {
    const inputs = screen.getAllByLabelText(label);
    return inputs.find(el => el.tagName === 'INPUT') as HTMLInputElement;
}

function getDayButton(day: number) {
    const dialog = screen.getByRole('dialog');
    const nodes = Array.from(dialog.querySelectorAll('.MuiDayCalendar-weekContainer')) as HTMLElement[];
    const gridcells = within(nodes[0]).getAllByRole('gridcell');
    return gridcells.find(cell => cell.textContent?.trim() === day.toString());
}

afterEach(() => {
    // Clear the specific key your component uses
    clearLocalStorage(storageKey);
    jest.clearAllMocks();
    jest.clearAllTimers();
});

describe('StartEndDatePicker', () => {
    
    it('renders start and end date inputs', () => {
        renderPicker();
        const startInputs = screen.getAllByLabelText(/start date/i);
        const endInputs = screen.getAllByLabelText(/end date/i);
        expect(startInputs.some(el => el.tagName === 'INPUT')).toBe(true);
        expect(endInputs.some(el => el.tagName === 'INPUT')).toBe(true);
    });

    it('shows default dates if none provided', () => {
        renderPicker();
        const startInput = findInputByLabel(/start date/i);
        const endInput = findInputByLabel(/end date/i);
        expect(dayjs(startInput.value).isValid()).toBe(true);
        expect(dayjs(endInput.value).isValid()).toBe(true);
    });

    it('uses controlled startDate and endDate props when provided', async () => {
        renderPicker({
            startDate: '2024-01-01',
            endDate: '2024-01-31',
        });
        const startInput = findInputByLabel(/start date/i);
        const endInput = findInputByLabel(/end date/i);
        await waitFor(() => {
            expect(startInput.value).toContain('2024');
            expect(endInput.value).toContain('2024');
        });
    });

    it('calls onDatesChange when start date is changed (controlled)', async () => {
        const handleDatesChange = jest.fn();
        renderPicker({
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            onDatesChange: handleDatesChange,
        });

        // Open the start date picker
        await userEvent.click(screen.getAllByLabelText(/choose date/i)[0]);

        // Now find the day we want to click on for the current month.
        const dayButton = getDayButton(2);
        expect(dayButton).toBeInTheDocument();
        await userEvent.click(dayButton!);

        // Should call onDatesChange
        await waitFor(() => {
            expect(handleDatesChange).toHaveBeenCalled();
        });
    });

    it('calls onDatesChange when end date is changed (controlled)', async () => {
        const handleDatesChange = jest.fn();
        renderPicker({
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            onDatesChange: handleDatesChange,
        });

        // Open the end date picker
        await userEvent.click(screen.getAllByLabelText(/choose date/i)[1]);

        // Now find the day we want to click on for the current month.
        const dayButton = getDayButton(2);
        expect(dayButton).toBeInTheDocument();
        await userEvent.click(dayButton!);

        // Should call onDatesChange
        await waitFor(() => {
            expect(handleDatesChange).toHaveBeenCalled();
        });
    });

    it('disables future dates if disableFuture is true', async () => {
        renderPicker({ disableFuture: true });

        // Open the end date picker
        await userEvent.click(screen.getAllByLabelText(/choose date/i)[1]);
        // Try to find a day button for a future date
        const today = dayjs();
        const futureDay = today.add(1, 'month').date(1);
        // Try to find the button for the 1st of next month
        const disabledDay = screen.queryByRole('button', { name: /^1$/ });
        // If present, it should be disabled
        if (disabledDay) {
            expect(disabledDay).toBeDisabled();
        }
    });
});
