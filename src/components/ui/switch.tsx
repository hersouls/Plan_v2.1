import * as React from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from './utils';

export interface SwitchProps extends Omit<React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>, 'onCheckedChange' | 'checked' | 'defaultChecked'> {
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
	checked,
	defaultChecked,
	onCheckedChange,
	className,
	disabled,
	...props
}) => {
	return (
		<RadixSwitch.Root
			{...props}
			checked={checked}
			defaultChecked={defaultChecked}
			disabled={disabled}
			onCheckedChange={onCheckedChange}
			className={cn(
				'relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors',
				disabled ? 'bg-gray-300 opacity-60' : checked ? 'bg-blue-600' : 'bg-gray-300',
				className
			)}
		>
			<RadixSwitch.Thumb
				className={cn(
					'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
					checked ? 'translate-x-5' : 'translate-x-1'
				)}
			/>
		</RadixSwitch.Root>
	);
};

export default Switch;