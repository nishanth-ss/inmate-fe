import React from 'react'
import InmateProfileCard from '../../components/InmateProfileCard'
import useFetchData from '@/hooks/useFetchData'

function InmateProfile() {

    const userName = localStorage.getItem('username');
    const {data,error} = useFetchData(`inmate/inmateid/${userName}`);
    
    return (
        <div className='w-full p-20'>
            <InmateProfileCard inmate={data?.[0]}/>
        </div>
    )
}

export default InmateProfile