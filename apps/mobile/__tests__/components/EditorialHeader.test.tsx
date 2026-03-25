import React from 'react';
import { render } from '@testing-library/react-native';
import { EditorialHeader } from '../../components/ui/EditorialHeader';

describe('EditorialHeader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders title', () => {
    const { getByText } = render(<EditorialHeader title="Welcome" />);
    expect(getByText('Welcome')).toBeTruthy();
  });

  it('label shown when provided', () => {
    const { getByText } = render(
      <EditorialHeader label="New" title="Welcome" />
    );
    expect(getByText('New')).toBeTruthy();
  });

  it('label hidden when not provided', () => {
    const { queryByText } = render(<EditorialHeader title="Welcome" />);
    // No label text should appear other than the title
    expect(queryByText('New')).toBeNull();
  });

  it('subtitle shown when provided', () => {
    const { getByText } = render(
      <EditorialHeader title="Welcome" subtitle="Your garden awaits" />
    );
    expect(getByText('Your garden awaits')).toBeTruthy();
  });
});
