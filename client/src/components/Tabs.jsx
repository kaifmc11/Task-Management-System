import { Tab } from "@headlessui/react";
import React from "react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Tabs({ tabs, setSelected, children }) {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <Tab.Group onChange={(index) => setSelected(index)}>
      <Tab.List className="flex space-x-6 rounded-xl p-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <Tab
            key={tab.title}
            className={({ selected }) =>
              classNames(
                "w-fit flex items-center outline-none gap-2 px-3 py-2.5 text-base font-medium leading-5",
                "focus:outline-none transition-colors duration-200",
                selected
                  ? "text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-800 hover:text-blue-800"
              )
            }
          >
            {tab.icon}
            <span>{tab.title}</span>
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-4">
        {tabs.map((_, idx) => (
          <Tab.Panel
            key={idx}
            className="focus:outline-none"
          >
            {childrenArray[idx] || childrenArray[0]}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}