import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { DropdownItem } from '../components/common/types';

const dropdownItems = [
    {
        id: 1,
        name: 'Hide'
    },
    {
        id: 2,
        name: 'Show'
    },
    {
        id: 3,
        name: 'Edit'
    },
    {
        id: 4,
        name: 'Delete'
    }
]

const Dropdown = ({ dropdownItems }: {dropdownItems: DropdownItem[]}) => {
  return (
    <Menu as="div" className="relative inline-block">
      <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-50">
        Options
        {/* <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" /> */}
      </MenuButton>

      <MenuItems
        transition
        className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        <div className="py-1">
          {dropdownItems.map((item) => (
            <MenuItem key={item.id}>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
              >
                {item.name}
              </a>
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  )
}

const Index = () => (
    <Dropdown dropdownItems={dropdownItems} />
);
 
export default Index;