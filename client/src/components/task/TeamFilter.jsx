import React from 'react';
import { HiUserGroup } from 'react-icons/hi';

const TeamFilter = ({ teams, selectedTeam, onTeamSelect }) => {
  return (
    <div className="relative">
      <select
        value={selectedTeam}
        onChange={(e) => onTeamSelect(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Teams</option>
        {teams.map((team) => (
          <option key={team} value={team}>
            {team}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <HiUserGroup className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
};

export default TeamFilter;